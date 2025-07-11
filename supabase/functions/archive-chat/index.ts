import { serve } from 'https://esm.sh/v135/supabase-functions@1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

export const main = serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE')!
    );

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`Archiving chat data older than: ${thirtyDaysAgo.toISOString()}`);

    // Move old chat_semantic data to chat_archive
    const { data: oldChatData, error: selectError } = await supabase
      .from('chat_semantic')
      .select('*')
      .lt('ts', thirtyDaysAgo.toISOString());

    if (selectError) {
      console.error('Error selecting old chat data:', selectError);
      return new Response(
        JSON.stringify({ error: 'Failed to select old chat data' }),
        { status: 500 }
      );
    }

    if (!oldChatData || oldChatData.length === 0) {
      console.log('No old chat data to archive');
      return new Response(
        JSON.stringify({ 
          message: 'No data to archive',
          archived: 0 
        }),
        { status: 200 }
      );
    }

    // Insert into archive table
    const { error: insertError } = await supabase
      .from('chat_archive')
      .insert(oldChatData);

    if (insertError) {
      console.error('Error inserting into archive:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert into archive' }),
        { status: 500 }
      );
    }

    // Delete from original table
    const { error: deleteError } = await supabase
      .from('chat_semantic')
      .delete()
      .lt('ts', thirtyDaysAgo.toISOString());

    if (deleteError) {
      console.error('Error deleting old chat data:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete old chat data' }),
        { status: 500 }
      );
    }

    console.log(`Successfully archived ${oldChatData.length} chat entries`);

    // Clean up old guardrail logs (keep for 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error: guardrailDeleteError } = await supabase
      .from('guardrail_log')
      .delete()
      .lt('ts', ninetyDaysAgo.toISOString());

    if (guardrailDeleteError) {
      console.error('Error cleaning up old guardrail logs:', guardrailDeleteError);
    } else {
      console.log('Cleaned up old guardrail logs');
    }

    return new Response(
      JSON.stringify({
        message: 'Chat archive completed successfully',
        archived: oldChatData.length,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Archive chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
});

export default main; 