import React, { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 模擬髮型數據
const hairstyles = [
  { id: 1, name: '時尚短髮', image: 'https://picsum.photos/150/150?random=1' },
  { id: 2, name: '優雅長髮', image: 'https://picsum.photos/150/150?random=2' },
  { id: 3, name: '波浪捲髮', image: 'https://picsum.photos/150/150?random=3' },
  { id: 4, name: '個性短捲', image: 'https://picsum.photos/150/150?random=4' },
  { id: 5, name: '直髮飄逸', image: 'https://picsum.photos/150/150?random=5' },
  { id: 6, name: '中長層次', image: 'https://picsum.photos/150/150?random=6' },
];

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<number | null>(null);

  const pickImageFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('權限被拒絕', '需要相冊權限才能選擇照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('權限被拒絕', '需要相機權限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '選擇照片',
      '請選擇獲取照片的方式',
      [
        { text: '相機拍照', onPress: takePhoto },
        { text: '從相冊選擇', onPress: pickImageFromLibrary },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FAFAFA" />
      
      {/* 標題區域 */}
      <View style={styles.header}>
        <Text style={styles.title}>AI 髮型設計師</Text>
        <Text style={styles.subtitle}>選擇照片，發現完美髮型</Text>
      </View>

      {/* 主體照片選擇區域 */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedPhoto} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Ionicons name="camera" size={48} color="#E0E0E0" />
              <Text style={styles.placeholderText}>點擊選擇照片或拍照</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {selectedImage && (
          <TouchableOpacity style={styles.changePhotoButton} onPress={showImagePicker}>
            <Text style={styles.changePhotoText}>更換照片</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 髮型選擇區域 */}
      <View style={styles.hairstyleSection}>
        <Text style={styles.sectionTitle}>選擇髮型風格</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hairstyleScrollContainer}
        >
          {hairstyles.map((hairstyle) => (
            <TouchableOpacity
              key={hairstyle.id}
              style={[
                styles.hairstyleCard,
                selectedHairstyle === hairstyle.id && styles.selectedHairstyleCard
              ]}
              onPress={() => setSelectedHairstyle(hairstyle.id)}
            >
              <Image source={{ uri: hairstyle.image }} style={styles.hairstyleImage} />
              <Text style={styles.hairstyleName}>{hairstyle.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 應用按鈕 */}
      {selectedImage && selectedHairstyle && (
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>應用髮型</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
  photoSection: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.4,
  },
  photoContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  placeholderPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  changePhotoButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  hairstyleSection: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 24,
    marginBottom: 20,
  },
  hairstyleScrollContainer: {
    paddingHorizontal: 16,
  },
  hairstyleCard: {
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedHairstyleCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  hairstyleImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  hairstyleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    width: 80,
  },
  applyButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});