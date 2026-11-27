package models

import (
	"encoding/json"
	"errors"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"
)

func TestTomanAmountJSONAcceptsOnlyWholeTomanIntegers(t *testing.T) {
	for _, raw := range []string{"0", "1", "1250000", "1000000000000"} {
		var amount TomanAmount
		require.NoError(t, json.Unmarshal([]byte(raw), &amount), raw)
		encoded, err := json.Marshal(amount)
		require.NoError(t, err)
		require.Equal(t, raw, string(encoded))
	}

	for _, raw := range []string{"-1", "1.5", "1e3", "\"100\"", "null", "01", "1000000000001"} {
		var amount TomanAmount
		require.Error(t, json.Unmarshal([]byte(raw), &amount), raw)
	}
}

func TestTomanAmountSQLRoundTrip(t *testing.T) {
	var amount TomanAmount
	require.NoError(t, amount.Scan(int64(250000)))
	value, err := amount.Value()
	require.NoError(t, err)
	require.Equal(t, int64(250000), value)
	require.Equal(t, TomanAmount(250000), amount)
}

func TestTomanAmountRejectsInvalidSQLValues(t *testing.T) {
	var amount TomanAmount
	require.Error(t, amount.Scan(float64(12.5)))
	require.Error(t, amount.Scan(int64(-1)))
	require.True(t, errors.Is(TomanAmount(-1).Validate(), ErrInvalidTomanAmount))
	require.True(t, errors.Is(TomanAmount(TomanAmountMax+1).Validate(), ErrTomanAmountOutOfRange))
}

func TestTomanAmountDeclaresBigintToGorm(t *testing.T) {
	type modelWithTomanAmount struct {
		Amount TomanAmount
	}
	parsed, err := schema.Parse(&modelWithTomanAmount{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)
	require.Equal(t, "bigint", string(parsed.FieldsByName["Amount"].DataType))
}
