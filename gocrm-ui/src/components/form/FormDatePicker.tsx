import React, { useMemo, useState } from 'react';
import { IconButton, Popover, Stack, TextField, Typography, Button, Box } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarMonth } from '@mui/icons-material';
import { Controller, useFormContext } from 'react-hook-form';
import { formatPersianCalendarDate, toDate } from '@/utils/date';
import type { DateInput } from '@/utils/date';

type FormDatePickerProps = {
  name: string;
  label: string;
  minDate?: Date;
  maxDate?: Date;
} & Omit<React.ComponentProps<typeof TextField>, 'name' | 'type' | 'value' | 'onChange'>;

type PersianParts = { year: number; month: number; day: number };
const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  calendar: 'persian', numberingSystem: 'latn', year: 'numeric', month: 'numeric', day: 'numeric',
});
const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  calendar: 'persian', numberingSystem: 'arabext', month: 'long', year: 'numeric',
});
const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const latinDigits = '٠١٢٣٤٥٦٧٨٩';

const partsOf = (date: Date): PersianParts => {
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
};
const normalizeDigits = (value: string): string =>
  value.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(latinDigits.indexOf(digit)))
    .replace(/[.-]/g, '/');

const parsePersianDate = (value: string): Date | null => {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalizeDigits(value.trim()));
  if (!match) return null;
  const target = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (target.year < 1200 || target.month < 1 || target.month > 12 || target.day < 1 || target.day > 31) return null;
  const start = new Date(target.year + 621, 0, 1);
  const end = new Date(target.year + 623, 0, 1);
  for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const current = partsOf(cursor);
    if (current.year === target.year && current.month === target.month && current.day === target.day) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    }
  }
  return null;
};

const findPersianMonthStart = (year: number, month: number): Date => {
  const start = new Date(year + 621, 0, 1);
  const end = new Date(year + 623, 0, 1);
  for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const parts = partsOf(cursor);
    if (parts.year === year && parts.month === month && parts.day === 1) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    }
  }
  return new Date(year + 621, month - 1, 1);
};

const addPersianMonth = (year: number, month: number, delta: number): [number, number] => {
  const index = year * 12 + month - 1 + delta;
  return [Math.floor(index / 12), ((index % 12) + 12) % 12 + 1];
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const FormDatePicker: React.FC<FormDatePickerProps> = ({ name, label, minDate, maxDate, helperText, ...props }) => {
  const { control } = useFormContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<[number, number] | null>(null);
  const open = Boolean(anchor);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...field }, fieldState: { error } }) => {
        const selected = toDate(value as DateInput);
        const initial = selected ?? new Date();
        const activeMonth = visibleMonth ?? [partsOf(initial).year, partsOf(initial).month];
        const first = findPersianMonthStart(activeMonth[0], activeMonth[1]);
        const gridStart = new Date(first);
        // Persian week starts Saturday; JS Sunday=0, so move back to Saturday.
        gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 1) % 7));
        const days = Array.from({ length: 42 }, (_, index) => {
          const day = new Date(gridStart);
          day.setDate(gridStart.getDate() + index);
          return day;
        });
        const monthTitle = monthFormatter.format(first);
        const displayedValue = selected ? formatPersianCalendarDate(selected, '', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        }).replace(/\u200e/g, '').replace(/-/g, '/') : '';

        const choose = (date: Date) => {
          onChange(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
          setAnchor(null);
        };
        return (
          <>
            <TextField
              {...field}
              {...props}
              label={label}
              value={displayedValue}
              placeholder="۱۴۰۵/۰۹/۰۶"
              onChange={(event) => {
                const text = event.target.value;
                const parsed = parsePersianDate(text);
                if (parsed) onChange(parsed);
                else if (text.trim() === '') onChange(null);
              }}
              error={!!error}
              helperText={error?.message || helperText || 'تاریخ را به‌صورت سال/ماه/روز شمسی وارد کنید'}
              fullWidth={props.fullWidth ?? true}
              InputProps={{
                ...props.InputProps,
                endAdornment: (
                  <IconButton aria-label="باز کردن تقویم شمسی" onClick={(event) => {
                    setVisibleMonth([partsOf(selected ?? new Date()).year, partsOf(selected ?? new Date()).month]);
                    setAnchor(event.currentTarget);
                  }} edge="end" size="small">
                    <CalendarMonth />
                  </IconButton>
                ),
              }}
              inputProps={{ ...props.inputProps, inputMode: 'numeric', dir: 'ltr', style: { textAlign: 'right', ...(props.inputProps?.style ?? {}) } }}
            />
            <Popover open={open} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
              <Box sx={{ p: 2, width: 300 }} dir="rtl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <IconButton aria-label="ماه قبل" size="small" onClick={() => setVisibleMonth(addPersianMonth(activeMonth[0], activeMonth[1], -1))}><ChevronRight /></IconButton>
                  <Typography fontWeight={700}>{monthTitle}</Typography>
                  <IconButton aria-label="ماه بعد" size="small" onClick={() => setVisibleMonth(addPersianMonth(activeMonth[0], activeMonth[1], 1))}><ChevronLeft /></IconButton>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {weekdays.map((day) => <Typography key={day} variant="caption" textAlign="center" color="text.secondary">{day}</Typography>)}
                  {days.map((day) => {
                    const parts = partsOf(day);
                    const inMonth = parts.year === activeMonth[0] && parts.month === activeMonth[1];
                    const disabled = (!!minDate && day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) ||
                      (!!maxDate && day > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));
                    return (
                      <Button key={day.toISOString()} size="small" disabled={!inMonth || disabled}
                        variant={selected && sameDay(day, selected) ? 'contained' : 'text'}
                        onClick={() => choose(day)}
                        sx={{ minWidth: 0, px: 0, color: inMonth ? undefined : 'text.disabled' }}>
                        {new Intl.NumberFormat('fa-IR').format(parts.day)}
                      </Button>
                    );
                  })}
                </Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Button size="small" onClick={() => choose(new Date())}>امروز</Button>
                  <Button size="small" onClick={() => { onChange(null); setAnchor(null); }}>پاک کردن</Button>
                </Stack>
              </Box>
            </Popover>
          </>
        );
      }}
    />
  );
};
