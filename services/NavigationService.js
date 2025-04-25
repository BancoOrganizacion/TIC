import { createRef } from 'react';

export const navigationRef = createRef();

export const NavigationService = {
  navigate: (name, params) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  },
  
  reset: (routeName, params = {}) => {
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      });
    }
  },
  
  goBack: () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  }
};