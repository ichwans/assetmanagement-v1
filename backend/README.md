# blade

## Description

[ActionPay](https://actionpay.co.id) Back Office For Super Apps

## Installation

```bash
$ go mod tidy
```

## Running the app

```bash
# development
$ go run main.go

# watch mode (using nodemon)
$ nodemon --exec go run main.go --signal SIGTERM

# production mode
$ ./bin/app
```

## Test

```bash
# unit tests
$ go test ./...
```