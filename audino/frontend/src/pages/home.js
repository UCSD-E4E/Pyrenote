import React from 'react';
import { Button } from '../components/button';
import spectrogramImage from '../images/PyrenoteLabelExample.png'
import Lyrebird from '../images/Lyrebird.jpg'
import { Link } from 'react-router-dom';
import { faWindowRestore } from '@fortawesome/free-solid-svg-icons';

const Home = (props) => {
    return (
    <div className="container h-75 text-center">
        THIS IS THE HOME PAGE
        <div className="row h-100 justify-content-center align-items-center" style={{display:"flex"}}>
            <div style={{float: "left", width: "50%"}}>
                <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '48px',
                    lineHeight: '59px', 
                    position:"relative",
                    width: "100%"
                }}>
                    <text>Pyrenote: A web-based,
                    manual annotation tool.</text>
                </div>
                <div style={{float: "left", position:"relative", display:"flex", width:"100%"}}>
                    <Button
                        type="primary"
                        text="Join The Labeling Now!"
                        onClick={() => {
                            props.history.push('/login');
                        }}
                    />
                    <Link 
                        style={{float: "right", position:"relative", right:"0%"}} 
                        to={{ pathname: "https://github.com/UCSD-E4E/Pyrenote" }} 
                        target="_blank" >
                    Get started on GitHub
                    </Link>
                </div>
            </div>
            <div style={{float: "left", display:"flex",  width: "50%"}}>
                <img 
                    src={spectrogramImage} 
                    alt="Spectrogram Image" 
                    style={{width: "100%"}}
                />
            </div>
        </div>
        <div className="row h-100 justify-content-center align-items-center" style={{display:"flex", backgroundColor: "#EFEFEF"}}>
            <div className="justify-content-center align-items-center" style={{float: "left", width: "50%"}}>
                <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '40px',
                    lineHeight: '59px', 
                    position:"relative",
                    width: "100%",

                }}>
                    <text>What is Pyrenote?</text>
                </div>
                <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '24px',
                    lineHeight: '29px', 
                    position:"relative",
                    width: "100%"
                }}>
                    <p>
                        Pyrenote creates moment to moment, or “strong” labels, for audio data.
                        Based on <a href="https://github.com/midas-research/audino">Audino</a>, Pyrenote displays a spectrogram for audio annotation, stores labels in a database, 
                        and optimizes the labeling process through simplifying the user interface to produce high-quality 
                        annotations in a short time frame.
                    </p>
                        
                    <p>
                        Pyrenote’s name is a combination of Python, Lyrebird, and note (such as making a note on a label)
                    </p>
                </div>
                <Button
                    type="primary"
                    text="Check out the paper!"
                    style={{width:"80%"}}
                    onClick={() => {
                        window.location = "https://ieeexplore.ieee.org/document/9637784";
                    }}
                />
            </div>
            <div style={{float: "left", display:"flex",  width: "50%"}}>
                <img 
                    src={Lyrebird} 
                    alt="Spectrogram Image" 
                    style={{width: "100%"}}
                />
                <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '24px',
                    lineHeight: '29px', 
                    position:"relative",
                    width: "100%"
                }}>
                <Link 
                    style={{float: "right", position:"relative", right:"0%"}} 
                    to={{ pathname: "https://www.facebook.com/donwilsonphotography" }} 
                    target="_blank" >
                    Superb lyrebird (© Donovan Wilson).
                </Link>
                </div>
            </div>
        </div>
        <div className="row h-100 justify-content-center align-items-center" style={{display:"flex"}}>
            <div className="justify-content-center align-items-center" style={{float: "left", width: "50%"}}>
            <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '40px',
                    lineHeight: '59px', 
                    position:"relative",
                    width: "100%",

                }}>
                    <text>About</text>
                </div>
                <div style={{
                    fontFamily: 'Montserrat',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '24px',
                    lineHeight: '29px', 
                    position:"relative",
                    width: "100%"
                }}>
                    <p>
                        Pyrenote is part of a larger effort to monitor ecosystems using passive acoustic monitoring. 
                        Annotations created in Pyrenote will be used to train machine learning models to identify bird vocalizations in field data,
                        which can then be used to calculate biodiversity metrics. 
                    </p>
                    <p>
                        
                        The <a href="https://e4e.ucsd.edu/acoustic-species-identification">Acoustic Species Identification</a> project is a collaboration between 
                        <a href="https://e4e.ucsd.edu/">Engineers for Exploration</a> and the Population Sustainability group from the
                        <a href="https://science.sandiegozoo.org/population-sustainability">San Diego Zoo Institute for Conservation Research</a>.

                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Home;
