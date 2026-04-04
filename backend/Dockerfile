FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["Setlist.Api.csproj", "./"]
RUN dotnet restore "./Setlist.Api.csproj"

# Copy everything else and build app
COPY . .
WORKDIR "/src/."
RUN dotnet publish "Setlist.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port (Render sets PORT environment variable)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Setlist.Api.dll"]
