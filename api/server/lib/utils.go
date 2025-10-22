package lib

import (
	"encoding/json"
	"log"
)

func PrettyJSON(input string) string {
	var obj interface{}
	if err := json.Unmarshal([]byte(input), &obj); err != nil {
		log.Println("Invalid JSON:", err)
		return input
	}

	pretty, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		log.Println("Error pretty printing:", err)
		return input
	}

	return string(pretty)
}
