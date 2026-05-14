interface DateRangeValue {
  from?: string;
  to?: string;
}

export default interface IMoleculeDateRange {
  label?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
}