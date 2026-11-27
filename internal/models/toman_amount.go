package models

import (
  "database/sql/driver"
  "errors"
  "fmt"
  "strconv"
  "strings"
)

// TomanAmount is an exact, whole-toman monetary amount. Its JSON representation
// is an integer; fractional values, exponent notation, strings and null are
// rejected. Monetary arithmetic must never use floating-point types.
type TomanAmount int64

const TomanAmountMax int64 = 1_000_000_000_000

var (
  ErrInvalidTomanAmount = errors.New("amount must be a whole non-negative toman integer")
  ErrTomanAmountOutOfRange = errors.New("amount exceeds the supported toman range")
)

// Validate checks the supported range for a whole-toman amount.
func (a TomanAmount) Validate() error {
  if a < 0 { return ErrInvalidTomanAmount }
  if int64(a) > TomanAmountMax { return ErrTomanAmountOutOfRange }
  return nil
}

// MarshalJSON emits an integer JSON token, never a quoted string.
func (a TomanAmount) MarshalJSON() ([]byte, error) {
  if err := a.Validate(); err != nil { return nil, err }
  return []byte(strconv.FormatInt(int64(a), 10)), nil
}

// UnmarshalJSON accepts only an unsigned integer JSON token. Decimal fractions
// and exponent notation are rejected rather than rounded.
func (a *TomanAmount) UnmarshalJSON(data []byte) error {
  if a == nil { return errors.New("cannot unmarshal toman amount into nil receiver") }
  token := strings.TrimSpace(string(data))
  if token == "" || token == "null" || token[0] == '-' || token[0] == '+' { return ErrInvalidTomanAmount }
  for _, r := range token { if r < '0' || r > '9' { return ErrInvalidTomanAmount } }
  if len(token) > 1 && token[0] == '0' { return ErrInvalidTomanAmount }
  value, err := strconv.ParseInt(token, 10, 64)
  if err != nil { return ErrTomanAmountOutOfRange }
  parsed := TomanAmount(value)
  if err := parsed.Validate(); err != nil { return err }
  *a = parsed
  return nil
}

// Value stores the amount as an exact SQL integer.
func (a TomanAmount) Value() (driver.Value, error) {
  if err := a.Validate(); err != nil { return nil, err }
  return int64(a), nil
}

// Scan reads an integer amount from a SQL driver without floating-point conversion.
func (a *TomanAmount) Scan(src any) error {
  if a == nil { return errors.New("cannot scan toman amount into nil receiver") }
  var value int64
  switch v := src.(type) {
  case int64: value = v
  case int32: value = int64(v)
  case int: value = int64(v)
  case []byte:
    parsed, err := strconv.ParseInt(string(v), 10, 64)
    if err != nil { return fmt.Errorf("%w: %v", ErrInvalidTomanAmount, err) }; value = parsed
  case string:
    parsed, err := strconv.ParseInt(v, 10, 64)
    if err != nil { return fmt.Errorf("%w: %v", ErrInvalidTomanAmount, err) }; value = parsed
  default: return fmt.Errorf("%w: unsupported SQL value %T", ErrInvalidTomanAmount, src)
  }
  parsed := TomanAmount(value)
  if err := parsed.Validate(); err != nil { return err }
  *a = parsed
  return nil
}
