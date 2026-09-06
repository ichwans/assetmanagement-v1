package utils

import (
	"bytes"
	"html/template"
)

func ParseHTMLTemplate(text string, data interface{}) (stringHtml string, err error) {
	buf := new(bytes.Buffer)
	t, err := template.New("tmpl").Parse(text)
	if err != nil {
		return
	}
	err = t.Execute(buf, data)
	if err != nil {
		return
	}
	stringHtml = buf.String()
	return
}
