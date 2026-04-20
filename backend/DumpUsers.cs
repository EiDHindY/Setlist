using System;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Setlist.Api.Data;
using Microsoft.Extensions.DependencyInjection;

// We will inject the DB context and dump users.
// Actually, it's easier to just add an endpoint in UserController temporary.
