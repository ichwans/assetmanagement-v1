package mongodb

import (
	"context"
	"fmt"
	"strings"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/labstack/gommon/color"
	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/x/mongo/driver/connstring"
)

func NewDB(cfg config.MongoDB, ctx context.Context, wg *sync.WaitGroup) (db *mongo.Database) {
	conn, err := connstring.Parse(cfg.URI)
	if err != nil {
		panic(err)
	}

	if conn.Database == "" {
		panic("mongouri database is empty")
	}

	// Initial connect attempt using provided URI
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(conn.String()))
	if err != nil {
		panic(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		// Try alternate SCRAM mechanisms if auth fails, otherwise bubble up.
		retryWith := ""
		msg := strings.ToLower(err.Error())
		if (strings.Contains(msg, "scram-sha-1") || strings.Contains(msg, "authentication failed")) && (conn.Username != "" || conn.PasswordSet) {
			retryWith = "SCRAM-SHA-256"
		} else if strings.Contains(msg, "scram-sha-256") && (conn.Username != "" || conn.PasswordSet) {
			retryWith = "SCRAM-SHA-1"
		}
		if retryWith != "" {
			_ = client.Disconnect(ctx)
			cred := options.Credential{
				AuthMechanism: retryWith,
				Username:      conn.Username,
				Password:      conn.Password,
				AuthSource:    conn.AuthSource,
			}
			client, err = mongo.Connect(ctx, options.Client().ApplyURI(conn.String()).SetAuth(cred))
			if err != nil {
				panic(err)
			}
			if err = client.Ping(ctx, nil); err != nil {
				panic(fmt.Errorf("mongodb auth failed (db=%s, authSource=%s, user=%t, mechanism=%s): %w", conn.Database, conn.AuthSource, conn.Username != "", retryWith, err))
			}
		} else {
			panic(err)
		}
	}

	db = client.Database(conn.Database)

	color.Println(color.Green(fmt.Sprintf("⇨ connected to mongodb on %s\n", conn.Database)))

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	wg.Add(1)
	go func() {
		defer wg.Done()
		sig := <-sigs
		startProcessTime := time.Now()
		log.Info(ctx, "mongodb disconnecting", sig)
		err := client.Disconnect(ctx)
		if err != nil {
			log.Error(ctx, "mongodb failed to disconnect", err)
			return
		}
		log.TInfo(ctx, "mongodb disconnected", startProcessTime, err)
	}()

	return
}
