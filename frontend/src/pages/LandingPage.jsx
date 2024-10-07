import '../App.css';
import '../css/landingPage.css';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage(){

    const routeTo = useNavigate();

    return(
        <div className='LandingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Talko Video Call</h2>
                </div>
                <div className='navlist'>
                    
                    <p onClick={() => {
                        routeTo("/guest123")
                    }}>Join as Guest</p>

                    <p onClick={() => {
                        routeTo("/auth")
                    }}>Register</p>

                    <div onClick={() => {
                        routeTo("/auth")
                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>
                    <p>Cover a distance by Talko Video Call</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>

                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>

        </div>
    );
}