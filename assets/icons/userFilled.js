import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const UserFilled = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="24px"
    height="24px"
    {...props}
  >
    <Path d="M16 16.958c-4.077 0-12.013 2.23-12.013 6.319 0 1.694 1.033 3.23 2.697 4.011 2.177 1.022 5.695 1.625 9.331 1.625 3.304 0 6.706-.498 9.288-1.629 1.646-.722 2.71-2.294 2.71-4.006C28.013 19.189 20.077 16.958 16 16.958zM16 3A6 6 0 1016 15 6 6 0 1016 3z"/>
  </Svg>
);

export default UserFilled;
