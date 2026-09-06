package main

import (
	"fmt"
	"os"
	"time"

	"gitlab.com/riski/cmd"
)

const banner = `
   _____                        __              ___ ___      ___.    
  /  _  \   ______ ______ _____/  |_           /   |   \ __ _\_ |__  
 /  /_\  \ /  ___//  ___// __ \   __\  ______ /    ~    \  |  \ __ \ 
/    |    \\___ \ \___ \\  ___/|  |   /_____/ \    Y    /  |  / \_\ \
\____|__  /____  >____  >\___  >__|            \___|_  /|____/|___  /
        \/     \/     \/     \/                      \/           \/ 
`

func main() {
	if tz := os.Getenv("TZ"); tz != "" {
		var err error
		time.Local, err = time.LoadLocation(tz)
		if err != nil {
			fmt.Printf("error loading location '%s': %v\n", tz, err)
		} else {
			fmt.Printf("location loaded '%s'\n", tz)
		}
	}

	fmt.Print(banner)
	cmd.Run()
}
