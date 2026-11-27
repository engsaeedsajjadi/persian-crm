package models

import (
	"fmt"
)

// TomanLineAmounts contains the server-computed amounts for one quote line.
// Every monetary field is a whole-toman integer.
type TomanLineAmounts struct {
	Gross      TomanAmount
	Discount   TomanAmount
	Net        TomanAmount
	Tax        TomanAmount
	GrossTotal TomanAmount
}

// ComputeTomanLineAmounts computes a line using exact integer arithmetic.
// Quantity is expressed in the existing thousandths-based QuoteQuantity;
// discount and tax rates are basis points (10000 = 100%). Each line amount
// follows the half-up rounding rule recorded in ADR 0001.
func ComputeTomanLineAmounts(quantity QuoteQuantity, unitPrice TomanAmount, discountBP, taxRateBP int64) (TomanLineAmounts, error) {
	if !quantity.InBounds() {
		return TomanLineAmounts{}, fmt.Errorf("invalid quantity")
	}
	if err := unitPrice.Validate(); err != nil {
		return TomanLineAmounts{}, err
	}
	if discountBP < 0 || discountBP > QuoteDiscountBPScale {
		return TomanLineAmounts{}, fmt.Errorf("discount basis points must be between 0 and 10000")
	}
	if taxRateBP < 0 || taxRateBP > QuoteDiscountBPScale {
		return TomanLineAmounts{}, fmt.Errorf("tax basis points must be between 0 and 10000")
	}

	gross, net, ok := ComputeQuoteLineAmounts(quantity, int64(unitPrice), discountBP)
	if !ok || gross > TomanAmountMax || net > TomanAmountMax {
		return TomanLineAmounts{}, ErrTomanAmountOutOfRange
	}

	discount := gross - net
	// net is bounded by 10^12 and taxRateBP by 10000, so this product
	// cannot overflow int64.
	tax := (net*taxRateBP + QuoteDiscountBPScale/2) / QuoteDiscountBPScale
	grossTotal := net + tax
	if tax > TomanAmountMax || grossTotal > TomanAmountMax {
		return TomanLineAmounts{}, ErrTomanAmountOutOfRange
	}

	return TomanLineAmounts{
		Gross:      TomanAmount(gross),
		Discount:   TomanAmount(discount),
		Net:        TomanAmount(net),
		Tax:        TomanAmount(tax),
		GrossTotal: TomanAmount(grossTotal),
	}, nil
}
