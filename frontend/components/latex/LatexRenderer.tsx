import React, { useState } from 'react';
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background-color: ${bgColor};
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      color: ${textColor};
      padding: 12px;
      line-height: 1.6;
    }
    #math {
      width: 100%;
      white-space: pre-wrap;
    }
    .katex { font-size: 1.1em; }
    .katex-display { margin: 0.5em 0; }
    .katex-error { color: #DC2626; font-size: 12px; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script>
    // Set content
    document.getElementById('math').textContent = ${JSON.stringify(latex)};

    // Auto-render with delimiters
    renderMathInElement(document.getElementById('math'), {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\\\[', right: '\\\\]', display: true},
        {left: '\\\\(', right: '\\\\)', display: false}
      ],
      throwOnError: false,
      errorColor: '#DC2626',
      trust: true
    });

    // Report height after render
    setTimeout(() => {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
    }, 100);
  </script>
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
  const [height, setHeight] = useState(50);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Debug: log what's being rendered
  console.log('[LatexRenderer] Received latex:', JSON.stringify(latex));

  if (!latex || latex.trim() === '') {
    console.log('[LatexRenderer] Empty latex, returning null');
    return null;
  }

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height') {
        setHeight(Math.max(data.height + 16, 40));
        setLoading(false);
      }
    } catch {
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
