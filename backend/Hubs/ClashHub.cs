using Microsoft.AspNetCore.SignalR;

namespace Setlist.Api.Hubs;

// Think of a "Hub" like a physical building where different chat rooms exist.
// This ClashHub manages all real-time communication for standard Battles and Listen Parties.
public class ClashHub : Hub
{
    // A client (the browser) runs a command like: `connection.invoke("JoinClash", "clash-123")`
    // SignalR receives it, and runs this C# method.
    public async Task JoinClash(string clashId)
    {
        // Hubs have built-in "Groups". A Group is just a room.
        // We add this specific user's connection to a room named after the clashId.
        await Groups.AddToGroupAsync(Context.ConnectionId, clashId);
        
        // Let everyone ELSE in that room know that someone joined (useful for presence avatars later)
        await Clients.Group(clashId).SendAsync("UserJoined", Context.ConnectionId);
        
        // This prints to your backend terminal when you run `dotnet run`
        Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} joined Clash {clashId}");
    }

    // A simple test method we can trigger from the frontend to see if votes are broadcasting
    public async Task SendTestVote(string clashId, string songId)
    {
        Console.WriteLine($"[SignalR] Vote received from {Context.ConnectionId} for song {songId} in Clash {clashId}");
        
        // We broadcast a "VoteReceived" event to EVERYONE currently inside the `clashId` room.
        // The Next.js frontend will be actively listening for the "VoteReceived" event to update the UI score.
        await Clients.Group(clashId).SendAsync("VoteReceived", songId);
    }
    
    // When a user closes their browser or app, SignalR automatically catches it
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} disconnected.");
        await base.OnDisconnectedAsync(exception);
    }
}
