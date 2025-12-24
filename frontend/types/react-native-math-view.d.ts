declare module 'react-native-math-view' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  interface MathViewConfig {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
  }

  interface MathViewProps {
    math: string;
    style?: ViewStyle | TextStyle | (ViewStyle | TextStyle)[];
    config?: MathViewConfig;
    resizeMode?: 'contain' | 'cover' | 'stretch';
    renderError?: (props: { error: string }) => React.ReactNode;
    onError?: (error: Error) => void;
    onLoad?: () => void;
  }

  export default class MathView extends Component<MathViewProps> {}

  export class MathText extends Component<MathViewProps> {}
}
