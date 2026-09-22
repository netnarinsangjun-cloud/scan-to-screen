/** A row of `public.products`. */
export type Product = {
  id: string;
  barcode_id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string | null;
};

/** The singleton row of `public.tv_state` (always id = 1). */
export type TvState = {
  id: number;
  current_barcode_id: string | null;
  updated_at: string | null;
};

/** Realtime channel health, surfaced on the standby screen and scanner header. */
export type RealtimeStatus = "connecting" | "live" | "reconnecting";

/** Typed database definition consumed by `createClient<Database>()`. */
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: {
          id?: string;
          barcode_id: string;
          title: string;
          description?: string | null;
          price?: number | null;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          barcode_id?: string;
          title?: string;
          description?: string | null;
          price?: number | null;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      tv_state: {
        Row: TvState;
        Insert: {
          id: number;
          current_barcode_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          current_barcode_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tv_state_current_barcode_id_fkey";
            columns: ["current_barcode_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["barcode_id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
