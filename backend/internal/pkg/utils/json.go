package utils

import (
	"encoding/json"

	"github.com/google/uuid"
)

func UnmarshalJSONToUUID(b []byte, key string) (u uuid.UUID, err error) {
	d := make(map[string]interface{})
	err = json.Unmarshal(b, &d)
	if err != nil {
		return
	}
	str, _ := d[key].(string)
	u, err = uuid.Parse(str)
	return
}
