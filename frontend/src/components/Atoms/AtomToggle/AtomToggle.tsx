'use client'

import { IAtomToggle } from '@/interfaces/Atoms/IAtomToggle/IAtomToggle';
import { useState } from 'react';

const AtomToggle = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'rounded',
  id,
  className = '',
}: IAtomToggle) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.checked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };


  const sizes = {
    sm: {
      switch: 'w-9 h-5',
      slider: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'w-11 h-6',
      slider: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'w-14 h-7',
      slider: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <label
      className={`
        relative inline-block cursor-pointer
        ${sizeConfig.switch}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >

      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />


      <span
        className={`
          absolute inset-0
          transition-colors duration-200 ease-in-out
          ${isChecked ? 'bg-primary-600' : 'bg-gray-300'}
          ${variant === 'rounded' ? 'rounded-full' : 'rounded-md'}
          ${disabled ? '' : 'hover:bg-opacity-90'}
        `}
      >

        <span
          className={`
            absolute left-0.5 top-0.5
            bg-white
            transition-transform duration-200 ease-in-out
            shadow-sm
            ${sizeConfig.slider}
            ${variant === 'rounded' ? 'rounded-full' : 'rounded'}
            ${isChecked ? sizeConfig.translate : 'translate-x-0'}
          `}
        />
      </span>
    </label>
  );
};

export default AtomToggle;