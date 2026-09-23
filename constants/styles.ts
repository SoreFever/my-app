import { StyleSheet } from "react-native";

export const appStyles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#86939e",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  inputDisabled: {
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "lightblue",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  avatar: {
    borderRadius: 999,
    overflow: "hidden",
    maxWidth: "100%",
    marginBottom: 20,
  },
  image: {
    objectFit: "cover",
    paddingTop: 0,
  },
  noImage: {
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 5,
  },
});
