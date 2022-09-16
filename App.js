/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';
// Import the RtcEngine class and view rendering components into your project.
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
} from 'react-native-agora';

import {requestCameraAndAudioPermission} from './components/Permission';
// Import the UI styles.
import styles from './components/Style';

const token =
  '007eJxTYLj8WtLC4+HsDy5bFrx3O/DnKc/Oz+fO8hxdu9ZxpvO6bPs8BQYLS9NEo2RLQ0Njo1STNCPjpMTkZCMzcwtDwzTjRJNkA5/Zcsln3sgnZzKqMDEyQCCIz8lQlpmSmu+cmJPDwAAACRUlYg==';
const appId = '895a2c91132e4f23bacc267811f3a4c0';
const channelName = 'videoCall';

export default class App extends Component {
  _engine;
  constructor(props) {
    super(props);
    this.state = {
      token,
      channelName,
      isHost: true,
      joinSucceed: false,
      peerIds: [],
    };

    if (Platform.OS === 'android') {
      requestCameraAndAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this._engine?.destroy();
  }

  init = async () => {
    this._engine = await RtcEngine.create(appId);
    // Enable the video module.
    await this._engine.enableVideo();

    this._engine.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed);
      const {peerIds} = this.state;
      if (peerIds.indexOf(uid) === -1) {
        this.setState({
          peerIds: [...peerIds, uid],
        });
      }
    });

    this._engine.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason);
      const {peerIds} = this.state;
      this.setState({
        // Remove peer ID from state array
        peerIds: peerIds.filter(id => id !== uid),
      });
    });

    this._engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.log('JoinChannelSuccess', channel, uid, elapsed);
      this.setState({
        joinSucceed: true,
      });
    });
  };

  startCall = async () => {
    await this._engine?.joinChannel(
      this.state.token,
      this.state.channelName,
      null,
      0,
    );
  };

  endCall = async () => {
    await this._engine?.leaveChannel();
    this.setState({peerIds: [], joinSucceed: false});
  };

  render() {
    return (
      <View style={styles.max}>
        <View style={styles.max}>
          <View style={styles.buttonHolder}>
            <TouchableOpacity onPress={this.startCall} style={styles.button}>
              <Text style={styles.buttonText}> Start Call </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.endCall} style={styles.button}>
              <Text style={styles.buttonText}> End Call </Text>
            </TouchableOpacity>
          </View>
          {this._renderVideos()}
        </View>
      </View>
    );
  }

  _renderVideos = () => {
    const {joinSucceed} = this.state;
    return joinSucceed ? (
      <View style={styles.fullView}>
        <RtcLocalView.SurfaceView
          style={styles.max}
          channelId={this.state.channelName}
          renderMode={VideoRenderMode.Hidden}
        />
        {this._renderRemoteVideos()}
      </View>
    ) : null;
  };

  // Set the rendering mode of the video view as Hidden,
  // which uniformly scales the video until it fills the visible boundaries.
  _renderRemoteVideos = () => {
    const {peerIds} = this.state;
    return (
      <ScrollView
        style={styles.remoteContainer}
        contentContainerStyle={{paddingHorizontal: 2.5}}
        horizontal={true}>
        {peerIds.map((value, index, array) => {
          return (
            <RtcRemoteView.SurfaceView
              style={styles.remote}
              uid={value}
              channelId={this.state.channelName}
              renderMode={VideoRenderMode.Hidden}
              zOrderMediaOverlay={true}
            />
          );
        })}
      </ScrollView>
    );
  };
}
