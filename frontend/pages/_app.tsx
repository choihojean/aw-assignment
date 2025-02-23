import type { AppProps } from "next/app";
import { useLoadAuth } from "../store/useAuthStore";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
    useLoadAuth();

    return <Component {...pageProps} />;
}

export default MyApp;
