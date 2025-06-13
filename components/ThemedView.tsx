import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = lightColor && darkColor 
    ? (colorScheme === 'dark' ? darkColor : lightColor)
    : (colorScheme === 'dark' ? '#000000' : '#FFFFFF');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
