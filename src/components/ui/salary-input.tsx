import { Input } from '@/components/ui/input'
import { formatNumberWithSeparator, parseNumberInput } from '@/lib/utils'
import { forwardRef, useState } from 'react'

interface SalaryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void
}

export const SalaryInput = forwardRef<HTMLInputElement, SalaryInputProps>(
  ({ onChange, onValueChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(
      value ? formatNumberWithSeparator(String(value)) : ''
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const numericValue = parseNumberInput(inputValue)
      const formatted = formatNumberWithSeparator(numericValue)
      
      setDisplayValue(formatted)
      
      // Call the original onChange with numeric value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: String(numericValue) },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
      
      // Call the callback with numeric value
      if (onValueChange) {
        onValueChange(numericValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const numericValue = parseNumberInput(displayValue)
      const formatted = formatNumberWithSeparator(numericValue)
      setDisplayValue(formatted)
      
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Keep the numeric display for easier editing
      const numericValue = parseNumberInput(displayValue)
      setDisplayValue(String(numericValue))
      
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)

SalaryInput.displayName = 'SalaryInput'
