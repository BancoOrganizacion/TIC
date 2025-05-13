import { createRef } from 'react';
import { CommonActions } from '@react-navigation/native';

export const navigationRef = createRef();

export const navigate = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    console.error('Navigation ref is not set up');
  }
};

export const reset = (routeName, params = {}) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      })
    );
  } else {
    console.error('Navigation ref is not set up');
  }
};

export default {
  navigate,
  reset,
  navigationRef,
};