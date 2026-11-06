import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TrackRow = {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string | null;
  genre_id: string | null;
  description: string | null;
  cover_url: string | null;
  audio_path: string | null;
  download_allowed: boolean;
  featured: boolean;
  is_demo: boolean;
  release_date: string | null;
  credits: string | null;
  rights_holders: string | null;
  genres: { name: string; slug: string } | null;
  artists: { name: string; slug: string } | null;
};

export const TRACK_SELECT =
  "id,title,artist_name,artist_id,genre_id,description,cover_url,audio_path,download_allowed,featured,is_demo,release_date,credits,rights_holders,genres(name,slug),artists(name,slug)";

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("genres").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed", bucket, path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path!, 3600);
      if (error) return null;
      return data.signedUrl;
    },
  });
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return { user: null, isAdmin: false };
      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return { user, isAdmin: !!isAdmin };
    },
  });
}
