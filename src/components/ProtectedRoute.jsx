import { Navigate } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });
    }, []);

    if (loading) return null;

    if (!session) {
        return <Navigate to="/login" />;
    }

    return children;
}