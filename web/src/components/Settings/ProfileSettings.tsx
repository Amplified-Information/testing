import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2, User as UserIcon } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().max(50, "First name must be 50 characters or less").optional(),
  last_name: z.string().max(50, "Last name must be 50 characters or less").optional(),
  username: z.string().max(30, "Username must be 30 characters or less").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(20, "Phone must be 20 characters or less").optional(),
  website_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  location: z.string().max(100, "Location must be 100 characters or less").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  avatar_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  date_of_birth: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  user: User | null;
}

const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const watchedAvatarUrl = watch("avatar_url");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        toast.error("Failed to load profile");
        return;
      }

      if (data) {
        // Only set string/text fields that match our form schema
        const formFields: (keyof ProfileFormData)[] = [
          "first_name", "last_name", "username", "email", "phone", 
          "website_url", "location", "bio", "avatar_url", "date_of_birth"
        ];
        
        formFields.forEach((field) => {
          if (data[field] !== null && data[field] !== undefined) {
            setValue(field, data[field] as string);
          }
        });
      }

      // Set email from user object if available
      if (user.email) {
        setValue("email", user.email);
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            ...data,
            date_of_birth: data.date_of_birth || null,
          },
          { onConflict: "id" }
        );

      if (error) {
        toast.error("Failed to save profile");
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={watchedAvatarUrl} />
          <AvatarFallback>
            <UserIcon className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            placeholder="https://example.com/avatar.jpg"
            {...register("avatar_url")}
          />
          {errors.avatar_url && (
            <p className="text-sm text-destructive mt-1">
              {errors.avatar_url.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              placeholder="John"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive mt-1">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              placeholder="Doe"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive mt-1">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="johndoe"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive mt-1">
                {errors.username.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              placeholder="https://johndoe.com"
              {...register("website_url")}
            />
            {errors.website_url && (
              <p className="text-sm text-destructive mt-1">
                {errors.website_url.message}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="New York, NY"
            {...register("location")}
          />
          {errors.location && (
            <p className="text-sm text-destructive mt-1">
              {errors.location.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Details</h3>
        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register("date_of_birth")}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-destructive mt-1">
              {errors.date_of_birth.message}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            className="resize-none"
            rows={4}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-sm text-destructive mt-1">
              {errors.bio.message}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!isDirty || saving}
          className="min-w-[100px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileSettings;