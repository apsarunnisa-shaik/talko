import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = ( WrappedComponent ) => {
    const AuthComponent = (props) => {
        
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")) {
                return true;
            } 
            return false;
        }

        //useEffect is used here to run the authentication check when the component first mounts (on initial render)
        useEffect(() => {
            if(!isAuthenticated()) {
                router("/auth")
            }
        }, [])

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;