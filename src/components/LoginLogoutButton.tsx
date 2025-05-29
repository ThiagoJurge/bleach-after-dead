"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/lib/auth-actions";
import SigninWithGoogleButton from "./signinWithGoogleButton";
import Link from "next/link";

const LoginButton = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  if (user) {
    return (
      <div>
        <Button
          variant="link"
          onClick={() => {
            signout();
            setUser(null);
          }}
        >
          Sair
        </Button>
        <Link href={"/admin"}>
          <Button variant="link">Editar Sistemas</Button>
        </Link>
      </div>
    );
  }
  return <SigninWithGoogleButton />;
};

export default LoginButton;
