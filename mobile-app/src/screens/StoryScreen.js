import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Or a text equivalent if not installed

const { width, height } = Dimensions.get('window');

export default function StoryScreen({ route, navigation }) {
  const { story } = route.params;
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simple 5-second progress bar animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        navigation.goBack();
      }
    });
  }, []);

  const handleShopNow = () => {
    // Pause or go back
    if (story.link) {
      if (story.link.includes('/product/')) {
        const productId = story.link.split('/product/')[1];
        navigation.replace('Product', { productId });
      } else {
        navigation.replace('Collection');
      }
    } else {
      navigation.replace('Collection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: story.image.replace('http://', 'https://') }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Gradient Overlay for Top Bar */}
        <View style={styles.topOverlay} />
        
        {/* Top Bar (Progress & Close) */}
        <View style={styles.topBar}>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
              ]} 
            />
          </View>
          
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.storyIcon}>
                <Image source={{ uri: story.image.replace('http://', 'https://') }} style={styles.storyIconImg} />
              </View>
              <Text style={styles.storyTitle}>{story.title}</Text>
              <Text style={styles.storyTime}>
                {new Date(story.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom "Shop Now" Section */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.shopNowBtn}
            onPress={handleShopNow}
            activeOpacity={0.8}
          >
            <Text style={styles.shopNowText}>SHOP NOW</Text>
            <Text style={styles.shopNowIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)', // Simulating a dark gradient fade
  },
  topBar: {
    position: 'absolute',
    top: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f43f5e',
    overflow: 'hidden',
  },
  storyIconImg: {
    width: '100%',
    height: '100%',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  storyTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Faded bottom
  },
  shopNowBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  shopNowText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  shopNowIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
});
