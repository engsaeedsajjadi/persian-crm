package models

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestComputeTomanLineAmounts(t *testing.T) {
	got, err := ComputeTomanLineAmounts(QuoteQuantityFromMilli(1500), TomanAmount(100000), 1000, 900)
	require.NoError(t, err)
	require.Equal(t, TomanLineAmounts{
		Gross:      150000,
		Discount:   15000,
		Net:        135000,
		Tax:        12150,
		GrossTotal: 147150,
	}, got)
}

func TestComputeTomanLineAmountsRoundsHalfUp(t *testing.T) {
	got, err := ComputeTomanLineAmounts(QuoteQuantityFromMilli(500), TomanAmount(1), 0, 0)
	require.NoError(t, err)
	require.Equal(t, TomanAmount(1), got.Gross)
	require.Equal(t, TomanAmount(1), got.Net)
}

func TestComputeTomanLineAmountsRejectsInvalidInputs(t *testing.T) {
	tests := []struct {
		name       string
		quantity   QuoteQuantity
		price      TomanAmount
		discountBP int64
		taxRateBP  int64
		want       error
	}{
		{name: "quantity below minimum", quantity: QuoteQuantityFromMilli(0), price: 1},
		{name: "negative price", quantity: QuoteQuantityFromMilli(1000), price: -1, want: ErrInvalidTomanAmount},
		{name: "price above maximum", quantity: QuoteQuantityFromMilli(1000), price: TomanAmount(TomanAmountMax + 1), want: ErrTomanAmountOutOfRange},
		{name: "discount below zero", quantity: QuoteQuantityFromMilli(1000), price: 1, discountBP: -1},
		{name: "discount above maximum", quantity: QuoteQuantityFromMilli(1000), price: 1, discountBP: 10001},
		{name: "tax below zero", quantity: QuoteQuantityFromMilli(1000), price: 1, taxRateBP: -1},
		{name: "tax above maximum", quantity: QuoteQuantityFromMilli(1000), price: 1, taxRateBP: 10001},
		{name: "gross above maximum", quantity: QuoteQuantityFromMilli(2000), price: TomanAmount(TomanAmountMax)},
		{name: "taxed total above maximum", quantity: QuoteQuantityFromMilli(1000), price: TomanAmount(TomanAmountMax), taxRateBP: 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ComputeTomanLineAmounts(tt.quantity, tt.price, tt.discountBP, tt.taxRateBP)
			require.Error(t, err)
			if tt.want != nil {
				require.True(t, errors.Is(err, tt.want))
			}
		})
	}
}
