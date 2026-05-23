import git
import os
import pandas # Import pandas
import shutil # Import shutil for file operations

def list_staged_files_compact(server_base_path): # Added server_base_path as a parameter
    print("\n" + "="*15 + " Script Start " + "="*15 + "\n") # Start separator

    repo = git.Repo('.')
    staged_diffs = repo.index.diff('HEAD')

    data_for_df = [] # To store data for the DataFrame
    files_to_copy = [] # To store (source_path, relative_path) tuples for copying

    for diff_item in staged_diffs:
        
        current_path = diff_item.a_path # Path in the working directory / index

        if diff_item.change_type == 'D': # 'D' for added to the index
            file_name = os.path.basename(current_path)
            relative_path = current_path
            data_for_df.append(["Added (D)", file_name, relative_path])
            files_to_copy.append((current_path, relative_path))
        elif diff_item.change_type == 'M': # 'M' for modified in the index
            file_name = os.path.basename(current_path)
            relative_path = current_path
            data_for_df.append(["Modified (M)", file_name, relative_path])
            files_to_copy.append((current_path, relative_path))


    if data_for_df:
        df = pandas.DataFrame(data_for_df, columns=["Status", "File Name", "Relative Path"])
        print("--- Staged Files (Added or Modified) ---")
        print(df.to_string(index=False))

        confirmation = input("\nDo you want to copy these files to the IISL server? (yes/no): ").strip().lower()

        if confirmation == 'yes':

            print(f"\nCopying files to {server_base_path}...")
            for source_file_path, relative_file_path in files_to_copy:
                destination_file_path = os.path.join(server_base_path, relative_file_path)
                
                destination_directory = os.path.dirname(destination_file_path)
                if not os.path.exists(destination_directory):
                    print(f"Created directory: server not found")

                shutil.copy2(source_file_path, destination_file_path)
                print(f"Copied: {source_file_path} -> {destination_file_path}")
            print("File copying complete.")

    else:
        print("No added or modified files are staged.")

    print("\n" + "="*15 + "  Script End  " + "="*15 + "\n") # End separator

if __name__ == '__main__':
    SERVER_IISL_PATH = r"Z:\entities\IISL" # Server path defined in main
    list_staged_files_compact(SERVER_IISL_PATH) # Pass server path to the function
