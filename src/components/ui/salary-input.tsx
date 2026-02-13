import { Input } from '@/components/ui/input'
import { formatNumberWithSeparator, parseNumberInput } from '@/lib/utils'
import { forwardRef, useState, useEffect } from 'react'

interface SalaryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void
}

export const SalaryInput = forwardRef<HTMLInputElement, SalaryInputProps>(
  ({ onChange, onValueChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(
      value && !isNaN(Number(value)) ? formatNumberWithSeparator(String(value)) : ''
    )

    // Sync external value changes (e.g., from form reset)
    useEffect(() => {
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        setDisplayValue(formatNumberWithSeparator(String(value)))
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const numericValue = parseNumberInput(inputValue)
      const formatted = formatNumberWithSeparator(numericValue)
      
      setDisplayValue(formatted)
      
      // Call the original onChange with numeric value as NUMBER (not string)
      // This is important for valueAsNumber in react-hook-form
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { 
            ...e.target, 
            value: numericValue === 0 ? '' : String(numericValue),
            valueAsNumber: numericValue 
          },
        } as any
        onChange(syntheticEvent)
      }
      
      // Call the callback with numeric value
      if (onValueChange) {
        onValueChange(numericValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const numericValue = parseNumberInput(displayValue)
      if (!isNaN(numericValue) && numericValue !== 0) {
        const formatted = formatNumberWithSeparator(numericValue)
        setDisplayValue(formatted)
      } else {
        setDisplayValue('')
      }
      
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Keep the numeric display for easier editing
      const numericValue = parseNumberInput(displayValue)
      if (!isNaN(numericValue) && numericValue !== 0) {
        setDisplayValue(String(numericValue))
      }
      
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
