import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getStoredJson(key, fallbackValue) {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.error(error);
    return fallbackValue;
  }
}

export async function setStoredJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function removeStoredJson(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
