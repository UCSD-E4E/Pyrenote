// page for when project is NULL and back button is selected
import React from 'react';

const BackError = () => {
  return (
    <div style={styles.container}>
      <h1>Please Select a Project Before Attempting to Return to Previous Project</h1>
    </div>
  );
};

//Text allignment style
const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center'
    }
  };

export default BackError;