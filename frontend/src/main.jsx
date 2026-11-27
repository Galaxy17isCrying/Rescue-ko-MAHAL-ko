import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <LanguageProvider>
            <BrowserRouter>
                <Suspense fallback={<div className="app-loading" role="status">Loading ResQ Ko…</div>}>
                    <App />
                </Suspense>
            </BrowserRouter>
        </LanguageProvider>
    </React.StrictMode>
);
