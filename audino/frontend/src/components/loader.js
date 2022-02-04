import React from 'react';

const Loader = (style={}) => {
  return <div style={style} className="spinner-border" role="status" />;
};

const LoadingBar = (params) => {
  const current = params.current
  const total = params.total
  const percentComplete = current/total
  console.log(params, total === null || current === total)
  let border =  "solid none solid solid"
  if (total == null || current === total) {
    border =  "solid"
  }

  return (
    <div style={{position: "relative", height: "50px", marginBottom: "5px"}}>
      <div style={{position: "absolute",  top: "0px", left: "0px", height: "50px", width: percentComplete * 100 + "%", backgroundColor: "green", borderStyle: border, outlineColor:"black", float: "left", zIndex: 3,}}/>
      <div style={{position: "absolute", top: "0px", left: "0px", zIndex: 1, height: "50px", width:  100 + "%", backgroundColor: "white", borderStyle: "solid solid solid none", outlineColor:"black", }}/>
    </div>
  )
};

export default Loader;
export {Loader, LoadingBar}
