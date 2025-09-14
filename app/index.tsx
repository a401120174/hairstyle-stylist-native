import { useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { useHairstyleGenerator } from '../hooks/useHairstyleGenerator';
import { useCredits } from '../hooks/useCredits';

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
  const { credits, loading } = useCredits();
  const { 
    generate, 
    loading: generatingHairstyle, 
    generatedImage, 
    clearGeneratedImage,
    canGenerate,
    creditsNeeded,
    currentCredits 
  } = useHairstyleGenerator();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<number | null>(null);

  // 應用髮型函數 - 使用新的 API
  const applyHairstyle = async () => {
    // 檢查是否可以生成
    if (!canGenerate) {
      Alert.alert(
        '點數不足',
        `此功能需要 ${creditsNeeded} 點數，您目前有 ${currentCredits} 點數。\n\n是否前往購買點數？`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '購買點數', 
            onPress: () => router.push('/credits-store' as any) 
          }
        ]
      );
      return;
    }
    
    try {
      const imageUrl = await generate();
      
      if (imageUrl) {
        // 清除之前的生成圖片
        clearGeneratedImage();
        // 這裡可以顯示生成的髮型圖片或導航到結果頁面
        console.log('Generated hairstyle image:', imageUrl);
      }
    } catch (error) {
      console.error('Hairstyle generation failed:', error);
      // 錯誤已經在 useHairstyleGenerator 中處理了
    }
  };

  // 如果正在加載認證狀態，顯示載入畫面
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>載入中...</Text>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>AI 髮型設計師</Text>
            <Text style={styles.subtitle}>選擇照片，發現完美髮型</Text>
          </View>
          <View style={styles.headerRightSection}>
            {/* 點數顯示 */}
            <TouchableOpacity 
              style={styles.creditsButton}
              onPress={() => router.push('/credits-store' as any)}
            >
              <Ionicons name="diamond-outline" size={16} color="#8B5CF6" />
              <Text style={styles.creditsText}>{credits?.balance || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
        <TouchableOpacity 
          style={[styles.applyButton, generatingHairstyle && { opacity: 0.7 }]}
          onPress={applyHairstyle}
          disabled={generatingHairstyle}
        >
          {generatingHairstyle ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.applyButtonText}>
              生成髮型 ({creditsNeeded} 點數)
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* 顯示生成的髮型圖片 */}
      {generatedImage && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>生成結果</Text>
          <Image source={{ uri: generatedImage }} style={styles.resultImage} />
          <TouchableOpacity 
            style={styles.clearResultButton}
            onPress={clearGeneratedImage}
          >
            <Text style={styles.clearResultText}>清除結果</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}