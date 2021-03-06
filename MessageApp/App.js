import {
  StyleSheet,
  View,
  Alert,
  TouchableHighlight,
  Image,
  Text,
  Dimensions,
  BackHandler,
  PermissionsAndroid
} from "react-native";
import React from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import { getStatusBarHeight } from "react-native-status-bar-height";

import Geolocation from 'react-native-geolocation-service';

import Status from "./components/Status.js";

import MessageList from "./components/MessageList";
import {
  createImageMessage,
  createLocationMessage,
  createTextMessage
} from "./utils/MessageUtils";
import Toolbar from "./components/Toolbar.js";
import ImageGrid from "./components/ImageGrid.js";

const App = () => {
  const [messages, setMessages] = React.useState([
    createImageMessage("https://picsum.photos"),
    createTextMessage("World"),
    createTextMessage("Hello"),
    createLocationMessage({
      latitude: 16.078570199999998,
      longitude: 108.14824949999999
    })
  ]);

  const [fullscreenImageId, setFullscreenImageId] = React.useState(null);
  const [fullscreenLocationId, setFullscreenLocationId] = React.useState(null);

  const [isInputFocused, setIsInputFocused] = React.useState(false);

  const dismissFullscreenImage = () => {
    setFullscreenImageId(null);
  };

  const dismissFullscreenLocation = () => {
    setFullscreenLocationId(null);
  };

  const handlePressMessage = ({ id, type }) => {
    switch (type) {
      case "text": {
        Alert.alert(
          "Delete message?",
          "Are you sure you want to permanently delete this message?",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                setMessages(messages.filter(message => message.id !== id));
              }
            }
          ]
        );
        break;
      }
      case "image": {
        setFullscreenImageId(id);
        setIsInputFocused(false);
        break;
      }
      case "location": {
        setFullscreenLocationId(id);
        setIsInputFocused(false);
        break;
      }
      default:
        break;
    }
  };
  renderMessageList = () => {
    return (
      <View style={styles.content}>
        <MessageList messages={messages} onPressMessage={handlePressMessage} />
      </View>
    );
  };

  handlePressImage = (uri) => {
    alert(uri);
    setMessages([createImageMessage(uri), ...messages]);
  };

  renderInputMethodEditor = () => {
    return <View style={styles.inputMethodEditor}>
      <ImageGrid 
        onPressImage={handlePressImage}
      />
    </View>;
  };
  renderToolbar = () => {
    return (
      <View style={styles.toolbar}>
        <Toolbar
          isFocused={isInputFocused}
          onSubmit={handleSubmit}
          onChangeFocus={handleChangeFocus}
          onPressCamera={handlePressToolbarCamera}
          onPressLocation={handlePressToolbarLocation}
        />
      </View>
    );
  };

  renderFullscreenImage = () => {
    if (!fullscreenImageId) return null;
    const image = messages.find(message => message.id === fullscreenImageId);
    if (!image) return null;
    const { uri } = image;
    return (
      <TouchableHighlight
        style={styles.fullscreenOverlay}
        onPress={dismissFullscreenImage}
      >
        <Image style={styles.fullscreenImage} source={{ uri }} />
      </TouchableHighlight>
    );
  };

  renderFullscreenLocation = () => {
    if (!fullscreenLocationId) return null;
    const location = messages.find(
      message => message.id === fullscreenLocationId
    );
    if (!location) return null;
    const { coordinate } = location;
    return (
      <View style={styles.fullscreenLocation}>
        <TouchableHighlight
          style={styles.fullscreenText}
          onPress={dismissFullscreenLocation}
        >
          <Text>Close</Text>
        </TouchableHighlight>
        <MapView
          style={styles.fullscreenLocation}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...coordinate,
            latitudeDelta: 0.08,
            longitudeDelta: 0.04
          }}
        >
          <MapView.Marker coordinate={coordinate} />
        </MapView>
      </View>
    );
  };

  const handlePressToolbarCamera = () => {
    // ...
  };
  const handlePressToolbarLocation = () => {
    requestFindLocationPermission();
    Geolocation.getCurrentPosition(position => {
      const {
        coords: { latitude, longitude }
      } = position;

      setMessages([
        createLocationMessage({
          latitude,
          longitude
        }),
        ...messages
      ])
    }, (error) => {
      alert('You did\'t turn on location')
    });
  };

  async function requestFindLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  const handleChangeFocus = isFocused => {
    setIsInputFocused(isFocused);
  };
  handleSubmit = text => {
    setMessages([createTextMessage(text), ...messages]);
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (fullscreenImageId) {
          dismissFullscreenImage();
        }
        if (fullscreenLocationId) {
          dismissFullscreenLocation();
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Status />
      {renderMessageList()}
      {renderToolbar()}
      {renderInputMethodEditor()}
      {renderFullscreenImage()}
      {renderFullscreenLocation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    flex: 1,
    backgroundColor: "#fff"
  },
  inputMethodEditor: {
    flex: 1,
    backgroundColor: "#fff"
  },
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    backgroundColor: "#fff"
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 2
  },
  fullscreenImage: {
    flex: 1,
    resizeMode: "contain"
  },
  fullscreenLocation: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 2
  },
  fullscreenMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 2
  },
  fullscreenText: {
    ...StyleSheet.absoluteFillObject,
    top: getStatusBarHeight() + 10,
    left: Dimensions.get("window").width - 70,
    zIndex: 3,
    backgroundColor: "rgba(1,1,1,0.3)",
    width: 50,
    height: 20,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default App;
