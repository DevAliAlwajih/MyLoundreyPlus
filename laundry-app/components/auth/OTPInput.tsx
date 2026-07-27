import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, I18nManager } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length, value, onChange }) => {
  const [otpArray, setOtpArray] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const { colors } = useThemeStore();

  useEffect(() => {
    // Sync external value to internal array
    const newArr = value.split('').slice(0, length);
    while (newArr.length < length) {
      newArr.push('');
    }
    setOtpArray(newArr);
  }, [value, length]);

  const handleChange = (text: string, index: number) => {
    // Only accept numbers
    const cleanedText = text.replace(/[^0-9]/g, '');
    
    if (cleanedText.length > 1) {
      // Handle paste
      const pastedOTP = cleanedText.slice(0, length).split('');
      const newArr = [...otpArray];
      pastedOTP.forEach((char, i) => {
        newArr[i] = char;
      });
      setOtpArray(newArr);
      onChange(newArr.join(''));
      
      // Focus last filled or last input
      const nextIndex = Math.min(pastedOTP.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const newArr = [...otpArray];
    newArr[index] = cleanedText;
    setOtpArray(newArr);
    onChange(newArr.join(''));

    // Move to next input
    if (cleanedText !== '' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
    if (key === 'Backspace' && otpArray[index] === '' && index > 0) {
      // Move to previous input on backspace if current is empty
      inputsRef.current[index - 1]?.focus();
      
      const newArr = [...otpArray];
      newArr[index - 1] = '';
      setOtpArray(newArr);
      onChange(newArr.join(''));
    }
  };

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, I18nManager.isRTL && styles.rtlContainer]}>
      {otpArray.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputsRef.current[index] = ref; }}
          style={[styles.input, digit ? styles.inputFilled : null]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          // Force LTR for OTP numbers
          textAlign="center"
          placeholderTextColor={colors.textMuted}
        />
      ))}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  rtlContainer: {
    flexDirection: 'row-reverse', // Ensure order is LTR even in RTL mode
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 24,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFilled: {
    borderColor: colors.primary,
  },
});

