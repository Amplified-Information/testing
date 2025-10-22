import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a deterministic avatar for a wallet ID
 * @param walletId The Hedera wallet ID (e.g., "0.0.123456")
 * @returns Promise<string | null> The avatar URL or null if generation failed
 */
export async function generateWalletAvatar(walletId: string): Promise<string | null> {
  try {
    console.log('Generating avatar for wallet:', walletId);
    
    // Call the edge function to generate avatar
    const { data, error } = await supabase.functions.invoke('generate-avatar', {
      body: { walletId }
    });
    
    if (error) {
      console.error('Avatar generation error:', error);
      return null;
    }
    
    if (data?.success && data?.avatarUrl) {
      console.log('Avatar generated successfully:', data.avatarUrl);
      return data.avatarUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to generate avatar:', error);
    return null;
  }
}

/**
 * Checks if a wallet already has an avatar
 * @param walletId The Hedera wallet ID
 * @returns Promise<string | null> The existing avatar URL or null
 */
export async function getExistingWalletAvatar(walletId: string): Promise<string | null> {
  try {
    // First get the wallet and its user_id
    const { data: walletData } = await supabase
      .from('hedera_wallets')
      .select('user_id')
      .eq('account_id', walletId)
      .maybeSingle();
    
    if (!walletData?.user_id) {
      return null;
    }
    
    // Then get the profile with the avatar
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', walletData.user_id)
      .maybeSingle();
    
    return profileData?.avatar_url || null;
  } catch (error) {
    console.error('Failed to check existing avatar:', error);
    return null;
  }
}

/**
 * Updates a user's profile with the generated avatar
 * @param userId The user ID
 * @param avatarUrl The avatar URL
 * @returns Promise<boolean> Success status
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to update user avatar:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update user avatar:', error);
    return false;
  }
}