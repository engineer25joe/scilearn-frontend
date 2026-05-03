const accessLesson = async () => {
  setLoading(true);
  try {
    const userData = await AsyncStorage.getItem('scibase_user');
    const user = JSON.parse(userData);

    const res = await fetch(
      `https://scilearnbackend.onrender.com/api/courses/watch/${lessonId}/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': user.username,
        },
      }
    );
    const data = await res.json();

    if (res.ok) {
      setAccessed(true);
      setPlaying(true);
      user.tokens = data.tokens_remaining;
      await AsyncStorage.setItem('scibase_user', JSON.stringify(user));
    } else {
      Alert.alert('Error', data.error || 'Cannot access lesson');
    }
  } catch (e) {
    Alert.alert('Error', 'Cannot connect to server: ' + e.message);
  }
  setLoading(false);
};