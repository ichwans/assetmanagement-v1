package utils

import (
	"gorm.io/gorm"
)

type DBCond struct {
	Joins       string
	JoinArgs    interface{}
	Where       interface{}
	WhereArgs   interface{}
	Preload     string
	PreloadArgs interface{}
	Order       interface{}
}

func CompileConds(db *gorm.DB, conds ...DBCond) *gorm.DB {
	for _, cond := range conds {
		if cond.Joins != "" {
			if cond.JoinArgs != nil {
				if nestedConds, ok := cond.JoinArgs.([]DBCond); ok {
					cond.JoinArgs = func(db *gorm.DB) *gorm.DB {
						return CompileConds(db, nestedConds...)
					}
				}
				db = db.Joins(cond.Joins, cond.JoinArgs)
			} else {
				db = db.Joins(cond.Joins)
			}
			continue
		}
		if cond.Where != nil {
			if cond.WhereArgs != nil {
				if nestedConds, ok := cond.WhereArgs.([]DBCond); ok {
					cond.WhereArgs = func(db *gorm.DB) *gorm.DB {
						return CompileConds(db, nestedConds...)
					}
				}
				db = db.Where(cond.Where, cond.WhereArgs)
			} else {
				db = db.Where(cond.Where)
			}
			continue
		}
		if cond.Preload != "" {
			if cond.PreloadArgs != nil {
				if nestedConds, ok := cond.PreloadArgs.([]DBCond); ok {
					cond.PreloadArgs = func(db *gorm.DB) *gorm.DB {
						return CompileConds(db, nestedConds...)
					}
				}
				db = db.Preload(cond.Preload, cond.PreloadArgs)
			} else {
				db = db.Preload(cond.Preload)
			}
			continue
		}
		if cond.Order != nil {
			db = db.Order(cond.Order)
			continue
		}
	}
	return db
}
