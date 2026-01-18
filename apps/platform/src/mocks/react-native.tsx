import React from 'react';

// Basic View and Text components
export const View = ({ style, children, ...props }: any) => <div style={style} {...props}>{children}</div>;
export const Text = ({ style, children, ...props }: any) => <span style={style} {...props}>{children}</span>;
export const Image = ({ source, style, ...props }: any) => <img src={source?.uri || source} style={style} {...props} />;
export const ScrollView = ({ children, style, ...props }: any) => <div style={{ overflow: 'auto', ...style }} {...props}>{children}</div>;
export const FlatList = ({ data, renderItem, style }: any) => (
    <div style={{ overflow: 'auto', ...style }}>
        {data?.map((item: any, index: number) => renderItem({ item, index }))}
    </div>
);
export const TouchableOpacity = ({ children, onPress, style }: any) => <div onClick={onPress} style={{ cursor: 'pointer', ...style }}>{children}</div>;
export const TextInput = ({ style, ...props }: any) => <input style={style} {...props} />;
export const ActivityIndicator = ({ style, ...props }: any) => <div style={style} {...props}>Loading...</div>;
export const StatusBar = () => null;
export const SafeAreaView = ({ children, style }: any) => <div style={style}>{children}</div>;

// APIs
export const StyleSheet = {
    create: (styles: any) => styles,
    absoluteFill: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }
};
export const Platform = { OS: 'web' };
export const Dimensions = { get: () => ({ width: window.innerWidth, height: window.innerHeight }) };

// Expo mocks
export const BlurView = ({ children, style }: any) => <div style={style}>{children}</div>;
export const LinearGradient = ({ children, style }: any) => <div style={style}>{children}</div>;
