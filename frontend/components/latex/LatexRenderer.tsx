import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LatexRendererProps {
  latex: string;
  fontSize?: number;
  inline?: boolean;
  style?: object;
}

const createHtml = (latex: string, fontSize: number, isDark: boolean) => {
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const bgColor = isDark ? '#151718' : '#FFFFFF';

  // Escape special characters for HTML
  const escapedLatex = latex
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
      },
      svg: {
        fontCache: 'global'
      },
      startup: {
        ready: () => {
          MathJax.startup.defaultReady();
          MathJax.startup.promise.then(() => {
            const height = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height }));
          });
        }
      }
    };
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      color: ${textColor};
      background-color: ${bgColor};
      padding: 8px;
      overflow: hidden;
    }
    #content {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 20px;
    }
    .MathJax {
      font-size: ${fontSize}px !important;
    }
  </style>
</head>
<body>
  <div id="content">$$${escapedLatex}$$</div>
</body>
</html>
`;
};

export function LatexRenderer({
  latex,
  fontSize = 18,
  inline = false,
  style,
}: LatexRendererProps) {
  const webViewRef = useRef<WebView>(null);
  const [height, setHeight] = useState(50);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height') {
        setHeight(Math.max(data.height + 16, 40));
        setLoading(false);
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  const html = createHtml(latex, fontSize, isDark);

  return (
    <View style={[styles.container, { height: loading ? 50 : height }, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={[styles.webview, { opacity: loading ? 0 : 1 }]}
        scrollEnabled={false}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
