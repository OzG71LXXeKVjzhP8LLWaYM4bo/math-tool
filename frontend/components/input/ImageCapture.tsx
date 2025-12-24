import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ImageCaptureProps {
  onImageCaptured: (base64: string) => void;
  capturedImage: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export function ImageCapture({
  onImageCaptured,
  capturedImage,
  onClear,
  disabled = false,
}: ImageCaptureProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#444' : '#DDD';
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos of your handwritten work.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      onImageCaptured(result.assets[0].base64);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      onImageCaptured(result.assets[0].base64);
    }
  };

  if (capturedImage) {
    return (
      <View style={[styles.previewContainer, { backgroundColor: bgColor, borderColor }]}>
        <Image
          source={{ uri: `data:image/png;base64,${capturedImage}` }}
          style={styles.previewImage}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: '#DC262620' }]}
          onPress={onClear}
        >
          <Ionicons name="close" size={20} color="#DC2626" />
          <Text style={[styles.clearText, { color: '#DC2626' }]}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Capture your handwritten answer
      </Text>
      <Text style={[styles.subtitle, { color: subtextColor }]}>
        Take a photo or select from gallery
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.captureButton, { borderColor: activeColor }]}
          onPress={takePhoto}
          disabled={disabled}
        >
          <Ionicons name="camera" size={32} color={activeColor} />
          <Text style={[styles.buttonText, { color: activeColor }]}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, { borderColor: activeColor }]}
          onPress={pickImage}
          disabled={disabled}
        >
          <Ionicons name="images" size={32} color={activeColor} />
          <Text style={[styles.buttonText, { color: activeColor }]}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    width: 120,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 250,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
