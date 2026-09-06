/*
 * @Author: Arifin
 * @Date: 2019-12-27 22:38:20
 * @Last Modified by: Arifin
 * @Last Modified time: 2019-12-30 23:22:28
 */
package config

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"time"

	"github.com/labstack/gommon/color"
	"github.com/spf13/viper"
)

type DefaultConfig struct {
	Apps Apps `json:"apps"`
}

type Apps struct {
	Name     string `json:"name"`
	Version  string `json:"version"`
	Address  string `json:"address"`
	HttpPort string `json:"httpPort"`
}

type MySQLDB struct {
	DSN                string
	MinIdleConnections int
	MaxOpenConnections int
	MaxLifetime        int
	LogMode            bool
}

type PostgreSQLDB struct {
	Username           string
	Password           string
	Name               string
	Schema             string
	Host               string
	Port               int
	MinIdleConnections int
	MaxOpenConnections int
	MaxLifetime        int
	LogMode            bool
}

type MongoDB struct {
	Name            string        `json:"dbname"`
	Username        string        `json:"username"`
	Password        string        `json:"password"`
	URI             string        `json:"uri"`
	Timeout         time.Duration `json:"timeout"`
	MaxPoolSize     int64         `json:"maxPool"`
	MinPoolSize     int64         `json:"minPoolSize"`
	MaxConnIdleTime time.Duration `json:"maxConnIdleTime"`
}

var (
	// v viper global variable
	v *viper.Viper
	// env used environment
	env string
)

func init() {
	// initializing viper
	v = viper.New()
	// allow overriding configuration with environment variables
	v.AutomaticEnv()
	// convert config keys with dots to environment variables using underscores
	// e.g. retrieving "smtp.host" will look for the SMTP_HOST env var
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
}

// Load set viper configuration based on yaml files
// default configuration files are located in base path config.yaml.dist
func Load(env, localConfigName string) (err error) {
	return localConfig(env, localConfigName)
}

func localConfig(envShortCode, configName string) (err error) {
	var confEnv string
	v.SetConfigType("")

	if envShortCode != "" {
		confEnv = strings.ToLower(fmt.Sprintf("%s.%s", configName, envShortCode))
	} else {
		confEnv = strings.ToLower(configName)
	}

	v.SetConfigFile(configName)
	// v.SetConfigName(confEnv)
	// v.AddConfigPath("./")

	// path, err := os.Executable()
	// if err != nil {
	// 	return err
	// }
	// dir := filepath.Dir(path) + "./configs/"

	// v.AddConfigPath(dir)

	if err := v.ReadInConfig(); err != nil {
		panic(err)
	}
	color.Println(color.Green(fmt.Sprintf("⇨ config: '%v'", confEnv)))

	if envShortCode != "" {
		env = envShortCode
		color.Println(color.Green(fmt.Sprintf("⇨ environment: %s", env)))
	}

	return
}

// LoadFromFile load configuration from file
func LoadFromFile(path string) {
	b, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	v.SetConfigType(".env")
	v.ReadConfig(bytes.NewBuffer(b))
}

func LoadEnvUnitTest(path string, configType ...string) {
	b, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	if len(configType) < 1 {
		v.SetConfigFile("yaml")
	} else {
		v.SetConfigFile(configType[0])
	}
	v.ReadConfig(bytes.NewBuffer(b))
}

// GetEnv getting env
func GetEnv() string {
	return env
}

// GetConfig gets the global Viper instance.
func GetConfig() *viper.Viper {
	return v
}

// Set sets the value for the key in the override register.
func Set(key string, value interface{}) { v.Set(key, value) }

// Get returns an interface. For a specific value use one of the Get____ methods.
func Get(key string) interface{} { return v.Get(key) }

// GetString returns the value associated with the key as an string.
func GetString(key string) string { return v.GetString(key) }

// GetBool returns the value associated with the key as a bool.
func GetBool(key string) bool { return v.GetBool(key) }

// GetInt returns the value associated with the key as an integer.
func GetInt(key string) int { return v.GetInt(key) }

// GetInt64 returns the value associated with the key as an integer.
func GetInt64(key string) int64 { return v.GetInt64(key) }

// GetFloat64 returns the value associated with the key as a float64.
func GetFloat64(key string) float64 { return v.GetFloat64(key) }

// GetDuration returns the value associated with the key as a duration.
func GetDuration(key string) time.Duration { return v.GetDuration(key) }

// GetStringSlice returns the value associated with the key as a slice of strings.
func GetStringSlice(key string) []string { return v.GetStringSlice(key) }

// GetStringMap returns the value associated with the key as a map of interfaces.
func GetStringMap(key string) map[string]interface{} { return v.GetStringMap(key) }

// GetStringMapString returns the value associated with the key as a map of strings.
func GetStringMapString(key string) map[string]string { return v.GetStringMapString(key) }

// GetStringMapStringSlice returns the value associated with the key as a map to a slice of strings.
func GetStringMapStringSlice(key string) map[string][]string { return v.GetStringMapStringSlice(key) }
