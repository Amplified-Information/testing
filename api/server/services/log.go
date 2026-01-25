package services

import (
	"fmt"
	"log"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type LogService struct {
	logger *zap.SugaredLogger
}

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

func (ls *LogService) InitLogger(level LogLevel) {
	var zapLevel zapcore.Level
	switch level {
	case DEBUG:
		zapLevel = zapcore.DebugLevel
	case INFO:
		zapLevel = zapcore.InfoLevel
	case WARN:
		zapLevel = zapcore.WarnLevel
	case ERROR:
		zapLevel = zapcore.ErrorLevel
	default:
		zapLevel = zapcore.InfoLevel
	}
	cfg := zap.NewProductionConfig()
	cfg.Level = zap.NewAtomicLevelAt(zapLevel)
	l, _ := cfg.Build()
	ls.logger = l.Sugar()

	log.Printf("Service: Log service initialized successfully, %p", ls)
}

func (ls *LogService) Log(level LogLevel, msg string, args ...interface{}) error {
	// 1. logs with the appropriate warning level
	// 2. returns the output just logged
	switch level {
	case ERROR:
		ls.logger.Errorf(msg, args...)
	case WARN:
		ls.logger.Warnf(msg, args...)
	case INFO:
		ls.logger.Infof(msg, args...)
	case DEBUG:
		ls.logger.Debugf(msg, args...)
	}
	return fmt.Errorf(msg, args...)
}
